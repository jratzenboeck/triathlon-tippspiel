import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const authHeader = event.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const { token: inviteToken } = JSON.parse(event.body)

    const { data: invite, error: inviteErr } = await supabase
      .from('invites')
      .select('*')
      .eq('token', inviteToken)
      .single()

    if (inviteErr || !invite || invite.used) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired invite' }) }
    }

    const { error: joinErr } = await supabase
      .from('group_members')
      .insert({ group_id: invite.group_id, user_id: user.id })

    if (joinErr) {
      if (joinErr.code === '23505') {
        return { statusCode: 200, body: JSON.stringify({ groupId: invite.group_id, alreadyMember: true }) }
      }
      throw joinErr
    }

    await supabase
      .from('invites')
      .update({ used: true })
      .eq('id', invite.id)

    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', invite.group_id)
      .single()

    return {
      statusCode: 200,
      body: JSON.stringify({ groupId: invite.group_id, groupName: group?.name }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
