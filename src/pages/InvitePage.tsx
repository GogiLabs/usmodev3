
import { Header } from "@/components/common/Header";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";

const InvitePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-purple-50">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <InviteAcceptance />
      </div>
    </div>
  );
};

export default InvitePage;
