import sys
sys.path.insert(0, '.')

# Test 1: ONNX predictor loads
from src.onnx_predictor import OnnxGesturePredictor
from pathlib import Path

pred = OnnxGesturePredictor()
print("ONNX loaded:", pred.is_loaded)
print("Gesture count:", len(pred.get_supported_gestures()))

# Test 2: RAG with FAISS
from rag.retriever import SchemeRetriever
r = SchemeRetriever()
print("\nRAG backend:", "FAISS" if r._semantic_available else "keyword")

results = r.search_schemes("I have a disability and need financial support", top_k=3)
print("Query: disability financial support")
for m in results:
    print(f"  [{m['relevance']:.3f}] {m['name']} | eligibility: {m['eligibility_result']['status']}")

# Test 3: categories endpoint
cats = r.get_categories()
print(f"\nCategories ({len(cats)}):", cats)
