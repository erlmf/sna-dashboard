import json

def patch(filename):
    with open(f'data/{filename}') as f:
        data = json.load(f)

    # Build community_id → keywords lookup
    comm_keywords = {}
    for c in data['communities']:
        try:
            kws = json.loads(c.get('top_keywords', '[]'))
        except:
            kws = []
        if not kws and c.get('dominant_keyword'):
            kws = [c['dominant_keyword']]
        comm_keywords[c['community_id']] = kws

    # Patch nodes
    patched = 0
    for node in data['nodes']:
        if not node.get('active_keywords'):
            comm_id = node.get('community_id')
            node['active_keywords'] = comm_keywords.get(comm_id, [])
            patched += 1

    with open(f'data/{filename}', 'w') as f:
        json.dump(data, f, ensure_ascii=False)

    filled = sum(1 for n in data['nodes'] if n.get('active_keywords'))
    print(f'✅ {filename}: patched {patched} nodes, {filled}/{len(data["nodes"])} with keywords')

patch('graph_data_comment.json')
patch('graph_data_mention.json')
patch('graph_data_combined.json')