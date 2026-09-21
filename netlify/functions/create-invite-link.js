import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const authHeader = event.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const { groupId } = JSON.parse(event.body || '{}')
    if (!groupId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'groupId is required' }) }
    }

    const { data: membership } = await supabase
      .from('group_members')
      .select('is_admin')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership?.is_admin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only group admins can generate invite links' })
      }
    }

    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        group_id: groupId,
        invited_by: user.id,
        email: null
      })
      .select('token')
      .single()

    if (insertError) throw insertError

    const baseUrl = process.env.URL || 'http://localhost:8888'
    return {
      statusCode: 200,
      body: JSON.stringify({ url: `${baseUrl}/invite/${invite.token}` })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
