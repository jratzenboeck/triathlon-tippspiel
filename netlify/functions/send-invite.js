import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { groupId, email } = JSON.parse(event.body)

    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        group_id: groupId,
        invited_by: user.id,
        email,
      })
      .select('*, groups(name)')
      .single()

    if (insertError) throw insertError

    const baseUrl = process.env.URL || 'http://localhost:8888'

    await resend.emails.send({
      from: 'Triathlon Tippspiel <noreply@your-domain.com>',
      to: email,
      subject: 'You\'ve been invited to join a group on Triathlon Tippspiel',
      html: `
        <p>You've been invited to join <strong>${invite.groups.name}</strong> on Triathlon Tippspiel!</p>
        <p><a href="${baseUrl}/invite/${invite.token}">Click here to accept the invite</a></p>
      `,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
