param([string]$ImagePath)

try {
    Add-Type -AssemblyName "System.Runtime.WindowsRuntime"
    [Windows.Media.Ocr.OcrEngine, Windows.Foundation.Diagnostics, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.Diagnostics, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    }

    function Await-Op($asyncOp, $type) {
        $method = $asTaskGeneric.MakeGenericMethod($type)
        $task = $method.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    }

    $resolved = (Resolve-Path $ImagePath).Path
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($resolved)
    $file = Await-Op $fileOp ([Windows.Storage.StorageFile])

    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = Await-Op $streamOp ([Windows.Storage.Streams.IRandomAccessStream])

    $decOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = Await-Op $decOp ([Windows.Graphics.Imaging.BitmapDecoder])

    $bmpOp = $decoder.GetSoftwareBitmapAsync()
    $bitmap = Await-Op $bmpOp ([Windows.Graphics.Imaging.SoftwareBitmap])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $lang = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages[0]
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }

    $ocrOp = $engine.RecognizeAsync($bitmap)
    $result = Await-Op $ocrOp ([Windows.Media.Ocr.OcrResult])

    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output $result.Text
} catch {
    Write-Error $_.Exception.ToString()
    exit 1
}
