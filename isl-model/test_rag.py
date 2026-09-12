import sys
sys.path.insert(0, '.')
from rag.retriever import SchemeRetriever

r = SchemeRetriever()
print("Backend:", "FAISS" if r._semantic_available else "keyword")

queries = [
    ("disability assistive devices support", "Disability"),
    ("education scholarship student financial help", "Education"),
    ("healthcare hospital medical treatment", "Healthcare"),
]

for query, category in queries:
    results = r.search_schemes(query, top_k=3)
    print(f"\nQuery: '{query}'")
    for m in results:
        print(f"  [{m['relevance']:.3f}] {m['name']} ({m['category']})")

cats = r.get_categories()
print(f"\nCategories ({len(cats)}): {cats}")
