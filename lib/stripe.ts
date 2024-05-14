import { PLANS } from '@/config/stripe'
import Stripe from 'stripe'
import { SignedIn, auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import User from "@/lib/database/models/user.model";
import { connectToDatabase } from "@/lib/database/mongoose";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  //apiVersion: '2023-08-16',
  typescript: true,
})

export async function getUserSubscriptionPlan() {
  const { userId } = auth();
  
  const user = await getUserById(userId);

  if (!user.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  await connectToDatabase();

  const dbUser = await User.findOne({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      stripeCurrentPeriodEnd: null,
    }
  }

  const isSubscribed = Boolean(
    dbUser.stripePriceId &&
      dbUser.stripeCurrentPeriodEnd && // 86400000 = 1 day
      dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
  )

  const plan = isSubscribed
    ? PLANS.find((plan) => plan.price.priceIds.test === dbUser.stripePriceId)
    : null

  let isCanceled = false
  if (isSubscribed && dbUser.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      dbUser.stripeSubscriptionId
    )
    isCanceled = stripePlan.cancel_at_period_end
  }

  return {
    ...plan,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    stripeCurrentPeriodEnd: dbUser.stripeCurrentPeriodEnd,
    stripeCustomerId: dbUser.stripeCustomerId,
    isSubscribed,
    isCanceled,
  }
}