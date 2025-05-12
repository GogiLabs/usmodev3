
import { Header } from "@/components/common/Header";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";
import { motion } from "framer-motion";

const InvitePage = () => {
  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-purple-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <InviteAcceptance />
      </div>
    </motion.div>
  );
};

export default InvitePage;
