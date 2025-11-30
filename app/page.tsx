import SplitText from "@/components/SplitText";
import ClickSpark from "@/components/ClickSpark";

export default function Home() {
  return (
    <div>
    <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <SplitText 
        text="Hé lô các bạn!!" 
        splitType="chars"
        className="text-4xl font-bold"
        stagger={0.03}
      />
    </main>
    </div>
  );
}
