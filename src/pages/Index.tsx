import ExpenseTracker from "@/components/ExpenseTracker";
import AuthWrapper from "@/components/AuthWrapper";

const Index = () => {
  return (
    <AuthWrapper>
      <ExpenseTracker />
    </AuthWrapper>
  );
};

export default Index;
