import Dashboard from '@/components/Dashboard'
import { db } from '@/db'
import { getUserSubscriptionPlan } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { SignedIn, auth } from "@clerk/nextjs";

const Page = async () => {

  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  /*const dbUser = await db.user.findFirst({
    where: {
      id: user.id
    }
  })7*/

  const subscriptionPlan = await getUserSubscriptionPlan()

  return <Dashboard subscriptionPlan={subscriptionPlan} />
}

export default Page
