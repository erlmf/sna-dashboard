import json

with open('data/graph_data.json') as f:
    data = json.load(f)

# Build community_id → keywords lookup
comm_keywords = {
    c['community_id']: json.loads(c.get('top_keywords', '[]')) or [c.get('dominant_keyword', '')]
    for c in data['communities']
}

# Patch nodes
for node in data['nodes']:
    comm_id = node.get('community_id')
    node['active_keywords'] = comm_keywords.get(comm_id, [])

with open('data/graph_data.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print('✅ Patched', len(data['nodes']), 'nodes')
kw_filled = [n for n in data['nodes'] if n.get('active_keywords')]
print('Nodes with keywords:', len(kw_filled))