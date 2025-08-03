import ExpenseTracker from "@/components/ExpenseTracker";
import AuthWrapper from "@/components/AuthWrapperMicroservices";

const Index = () => {
  return (
    <AuthWrapper>
      <ExpenseTracker />
    </AuthWrapper>
  );
};

export default Index;
