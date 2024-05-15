import Dashboard from '@/components/Dashboard'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { SignedIn, auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";

const Page = async () => {

  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  console.log("DASHBOARD: ===========================================> ")

  const subscriptionPlan = await getUserSubscriptionPlan()

  return <Dashboard subscriptionPlan={subscriptionPlan} />
}

export default Page
