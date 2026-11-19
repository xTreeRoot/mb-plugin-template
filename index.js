const demoBaseURL = 'https://raw.githubusercontent.com/xTreeRoot/mb-plugin-template/v0.1.0/demo';
const pageSize = 1;
const catalog = [
  { id: 'demo-440', name: '试听 · 440 Hz', duration: 2000 },
  { id: 'demo-660', name: '试听 · 660 Hz', duration: 2000 },
];

function toTrack({ id, name, duration }) {
  return {
    id,
    name,
    duration,
    artists: [{ id: 'mb-demo', name: 'MB 示例' }],
    album: { id: 'mb-demo-tones', name: '合成试听' },
  };
}

export function home() {
  return {
    sections: [{ title: '合成试听', tracks: catalog.map(toTrack) }],
  };
}

export function search({ query, kind = 'tracks', offset = 0 }) {
  if (kind !== 'tracks') return { tracks: [], more: false };
  if (!Number.isInteger(offset) || offset < 0) throw new Error('无效的搜索偏移');
  const keyword = query.trim().toLowerCase();
  if (!keyword) return { tracks: [], more: false };
  const matching = catalog.filter((track) => track.name.toLowerCase().includes(keyword));
  const nextOffset = offset + pageSize;
  return { tracks: matching.slice(offset, nextOffset).map(toTrack), more: nextOffset < matching.length };
}

export function stream({ id }) {
  const track = catalog.find((item) => item.id === id);
  if (!track) throw new Error('试听资源不存在');
  return { url: `${demoBaseURL}/${track.id}.wav`, type: 'wav' };
}
