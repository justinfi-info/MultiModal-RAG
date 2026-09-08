import { getAuth } from "firebase-admin/auth"
import { randomUUID } from "node:crypto"
import { app } from "../config/firebase.js"
import User from "../models/user.model.js"
import redis from "../../../shared/redis/redis.js"

// Rewrite the user's active session blob(s) in Redis so /api/me reflects
// the latest user document without requiring a re-login.
const refreshUserSessions = async (user) => {
    const sessionData = JSON.stringify({
        userID: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt
    })
    const ttl = 7 * 24 * 60 * 60

    // Preferred path: the user-session mapping written at login.
    const sessionId = await redis.get(`user-session-${user?._id}`)
    if (sessionId) {
        await redis.set(`session-${sessionId}`, sessionData, "EX", ttl)
        return
    }

    // Fallback: refresh every active session belonging to this user.
    // Also covers multiple devices, which the single mapping misses.
    const keys = await redis.keys("session-*")
    for (const key of keys) {
        const raw = await redis.get(key)
        if (!raw) continue
        try {
            if (JSON.parse(raw).userID === String(user._id)) {
                await redis.set(key, sessionData, "EX", ttl)
            }
        } catch { /* skip malformed/garbage session blobs */ }
    }
}

export const login = async (req, res) => {
    try {
        const { token } = req.body
        const decoded = await getAuth(app).verifyIdToken(token)
        let user = await User.findOne({
            firebaseUid: decoded.uid
        })

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
            })
        }

        const sessionId = randomUUID()
        await redis.set(`user-session-${user?._id}`, sessionId, "EX", 7 * 24 * 60 * 60)
        await redis.set(`session-${sessionId}`, JSON.stringify({
            userID: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 7 * 24 * 60 * 60)

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({ message: `login error ${error}` })

    }
}

export const logOut = async (req, res) => {
    try {
        const sessionId = req.cookies?.session
        await redis.del(`session-${sessionId}`)

        res.clearCookie("session")
        return res.status(200).json({ message: " logout successfully" })
    } catch (error) {
        return res.status(500).json({ message: `logout error ${error}` })
    }
}

export const updateUserPayment = async (req, res) => {
    try {
        const { plan, credits, userId } = req.body
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "User not Found" })
        }
        user.plan = plan
        user.credits += credits
        user.totalCredits += credits
        user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await user.save()

        const sessionData = JSON.stringify({
            userID: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        })
        const ttl = 7 * 24 * 60 * 60

        // Preferred path: the user-session mapping written at login.
        const sessionId = await redis.get(`user-session-${user?._id}`)
        if (sessionId) {
            await redis.set(`session-${sessionId}`, sessionData, "EX", ttl)
        } else {
            // Fallback: refresh every active session belonging to this user.
            // Also covers multiple devices, which the single mapping misses.
            const keys = await redis.keys("session-*")
            for (const key of keys) {
                const raw = await redis.get(key)
                if (!raw) continue
                try {
                    if (JSON.parse(raw).userID === String(user._id)) {
                        await redis.set(key, sessionData, "EX", ttl)
                    }
                } catch { /* skip malformed/garbage session blobs */ }
            }
        }

        return res.status(200).json({ success: true })

    } catch (error) {
        return res.status(500).json({ message: `update user payment error ${error}` })

    }
}

export const deductCredits = async (req, res) => {
    try {
        const { userId, agent } = req.body
        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            image: 10
        };

        const user = await User.findById(userId)

        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        const requiredCredits = COST[agent] || 1
        if (user.credits < requiredCredits) {
            return res.status(400).json({ message: "Not enough credits" })
        }
        user.credits -= requiredCredits
        await user.save()

        const sessionId = await redis.get(`user-session-${user?._id}`)
        console.log("sessionId", sessionId)
        await redis.set(`session-${sessionId}`, JSON.stringify({
            userID: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 7 * 24 * 60 * 60)

        return res.status(200).json({ success: true, credits:user.credits })
    } catch (error) {
        return res.status(500).json({ message: `deduct credits error ${error}` })

    }
}