import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  async function fetchUser() {
    const { data: { user: u } } = await supabase.auth.getUser()
    user.value = u
    if (u) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single()
      profile.value = data
    }
    loading.value = false
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) await fetchUser()
    return { error }
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (!error && data?.user) {
      await fetchUser()
    }
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, loading, fetchUser, signIn, signUp, signOut }
})
