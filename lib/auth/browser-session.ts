import { onAuthStateChanged, signOut, type User } from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

export function waitForBrowserSession() {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export function hasLiveBrowserSession() {
  return firebaseAuth.currentUser !== null
}

export function removeBrowserSession() {
  void signOut(firebaseAuth)
}
