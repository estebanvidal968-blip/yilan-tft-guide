import { loadComps, loadItems } from '@/lib/loadData';
import MineClient from '@/components/MineClient';

export default async function MinePage() {
  const comps = await loadComps();
  const items = await loadItems();
  return <MineClient comps={comps} items={items} />;
}
