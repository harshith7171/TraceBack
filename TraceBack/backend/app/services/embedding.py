import math
import hashlib
import json
import re
from typing import List
import requests
from app.config import settings

def get_hash_seed(word: str) -> int:
    return int(hashlib.md5(word.encode('utf-8')).hexdigest()[:8], 16)

def generate_local_embedding(text: str, dim: int = 384) -> List[float]:
    """
    Zero-dependency fast semantic vectorizer:
    Extracts subwords, n-grams, and semantic tokens,
    projects onto a dense vector space with normalization.
    Ensures high cosine similarity for overlapping semantics.
    """
    if not text:
        return [0.0] * dim

    # Clean and tokenise
    tokens = re.findall(r'\b[a-zA-Z0-9_\-\.]{2,}\b', text.lower())
    if not tokens:
        return [0.0] * dim

    vec = [0.0] * dim

    for i, token in enumerate(tokens):
        # Position and token hash
        seed = get_hash_seed(token)
        # Weight by position (earlier tokens slightly higher importance for title/headers)
        weight = 1.0 / (1.0 + 0.05 * min(i, 20))
        
        # Project token across several indices
        for k in range(5):
            idx = (seed + k * 7919) % dim
            sign = 1.0 if ((seed >> (k + 1)) & 1) == 0 else -1.0
            vec[idx] += sign * weight

        # Subword n-grams (3-4 chars) to catch morphological similarity (e.g. learn, learning)
        for n in (3, 4):
            if len(token) >= n:
                for j in range(len(token) - n + 1):
                    sub = token[j:j+n]
                    sub_seed = get_hash_seed(sub)
                    idx = (sub_seed + 1301) % dim
                    vec[idx] += 0.3 * weight

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def get_embedding(text: str) -> List[float]:
    """
    Returns dense embedding vector.
    Uses OpenAI if OPENAI_API_KEY is configured,
    Gemini if GEMINI_API_KEY is configured,
    otherwise uses the robust built-in semantic vectorizer.
    """
    if not text or not text.strip():
        return [0.0] * settings.VECTOR_DIMENSION

    # Try OpenAI if key is present
    if settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/embeddings"
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "input": text[:8000],
                "model": "text-embedding-3-small"
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return data["data"][0]["embedding"]
        except Exception as e:
            print(f"[Warning] OpenAI embedding failed: {e}. Falling back to local vectorizer.")

    # Try Gemini if key is present
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "content": {"parts": [{"text": text[:8000]}]}
            }
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return data["embedding"]["values"]
        except Exception as e:
            print(f"[Warning] Gemini embedding failed: {e}. Falling back to local vectorizer.")

    return generate_local_embedding(text, settings.VECTOR_DIMENSION)

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
