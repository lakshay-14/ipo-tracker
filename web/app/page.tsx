import { getIpos } from "@/lib/ipos";
import IpoList from "./ipo-list";

export default async function Home() {
  const ipos = await getIpos();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Indian IPOs</h1>
      <p className="mt-2 text-[15px] text-muted">
        Every mainboard and SME IPO in one place. Updated daily.
      </p>
      <div className="mt-8">
        <IpoList ipos={ipos} />
      </div>
    </div>
  );
}
