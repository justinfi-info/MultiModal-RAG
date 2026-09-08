import React from 'react'
import { AnimatePresence, motion } from "motion/react"
import { Crown, X } from "lucide-react"
import { useDispatch, useSelector } from 'react-redux'
import { createOrder } from '../features/createOrder'
import { verifyPayment } from '../features/verifyPayment'
import api from '../utils/axios'
import { setUserdata } from '../redux/userSlice'

function BillingDrawer({ open, onClose }) {
    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const handleUpgrade = async (plan) => {
        try {
            const data = await createOrder(plan)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data?.order?.amount,
                currency: data?.order?.currency,
                name: "MultivexAI",
                description: `${data?.plan?.name} Plan`,
                order_id: data?.order?.id,
                handler: async (response) => {
                    try {
                        const data = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        // Payment verified — refresh user data so the plan and
                        // credits shown in the drawer update without a reload.
                        if (data?.payment) {
                            const { data: updatedUser } = await api.get("/api/me")
                            dispatch(setUserdata(updatedUser))
                        }
                    } catch (error) {
                        console.log(error)
                    }
                },
                theme:{
                    color: "#4f46e5"
                }
            }
            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {

        }

    }

    const credits = userData?.credits || 0
    const totalCredits = userData?.totalCredits || 100
    return (
        <AnimatePresence>
            {open && <> <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: .5 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className='fixed inset-0 bg-black z-40'
            />
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: .25 }}
                    className='fixed right-0 top-0 z-50 h-screen w-[380px] bg-[#0f1117] border-l
                            border-white/10 shadow-2xl flex flex-col'>

                    <div className='flex items-center justify-between p-5 border-b border-white/10'>
                        <div>
                            <div className='text-white text-lg font-semibold'>
                                Billing
                            </div>
                            <div className='text-slate-400 text-sm'>
                                Plans & Credits
                            </div>
                        </div>
                        <button onClick={onClose} className='w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center'>
                            <X size={16} className='text-slate-300' />
                        </button>
                    </div>

                    <div className='shrink-0 p-5'>
                        <div className='rounded-xl bg-white/[0.04] border border-white/10 p-4'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <p className='text-slate-400 text-sm'>
                                        Current Plan
                                    </p>
                                    <h3 className='text-white text-xl font-bold capitalize'>
                                        {userData?.plan || "Free"}
                                    </h3>
                                </div>
                                <Crown className='text-yellow-400' />
                            </div>
                            <div className='mt-5'>
                                <div className='flex justify-between text-xs text-slate-400 mb-2'>
                                    <span>Credits</span>
                                    <span>{credits}/{totalCredits}</span>
                                </div>
                                <div className='h-2 rounded-full bg-white/10 overflow-hidden'>
                                    <div className='h-full bg-indigo-500 transition-all duration-500'
                                        style={{
                                            width: `${Math.min(
                                                (credits / totalCredits) * 100,
                                                100
                                            )}%`
                                        }} />
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className='px-5 pb-5 flex-1 overflow-y-auto space-y-4'>
                        {[
                            { id: "starter", name: "Starter Plan", amount: 59, credits: 500 },
                            { id: "pro", name: "Pro Plan", amount: 199, credits: 1000 }
                        ].map(plan => (
                            <div key={plan.id} className='rounded-xl bg-white/[0.04] border border-white/10 p-4'>
                                <h3 className='text-white font-semibold'>{plan.name}</h3>
                                <p className='text-indigo-400 text-2xl font-bold mt-2'>₹{plan.amount}</p>
                                <p className='text-slate-400 text-sm mt-1'>{plan.credits} Credits</p>
                                <button className='mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2
                                    text-white' onClick={() => handleUpgrade(plan.id)}>Upgrade</button>
                            </div>
                        ))}
                    </div>

                </motion.div>
            </>
            }
        </AnimatePresence>
    )
}

export default BillingDrawer
