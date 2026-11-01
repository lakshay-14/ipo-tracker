import { getIpos } from "@/lib/ipos";
import IpoList from "./ipo-list";

export default async function Home() {
  const ipos = await getIpos();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Indian IPOs</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every mainboard and SME IPO in one place. Updated daily.
      </p>
      <div className="mt-5">
        <IpoList ipos={ipos} />
      </div>
    </div>
  );
}
