import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmail, EMAIL_MESSAGES } from './_email.js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { groupId, email, locale } = JSON.parse(event.body)
    const copy = EMAIL_MESSAGES[locale === 'de' ? 'de' : 'en']

    const { data: membership } = await supabase
      .from('group_members')
      .select('is_admin')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership?.is_admin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only group admins can invite members' })
      }
    }

    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        group_id: groupId,
        invited_by: user.id,
        email
      })
      .select('*, groups(name)')
      .single()

    if (insertError) throw insertError

    const baseUrl = process.env.URL || 'http://localhost:8888'
    const publicUrl = process.env.URL || 'https://triathlon-tippspiel.jratzenboeck.com'
    const from = `Triathlon Tippspiel <${process.env.SMTP_SENDER_EMAIL || 'noreply@jratzenboeck.com'}>`
    const inviteUrl = `${baseUrl}/invite/${invite.token}`

    const { data: inviter } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const group = invite.groups.name
    const inviterName = inviter?.display_name || 'A friend'

    const { error: mailError } = await resend.emails.send({
      from,
      to: email,
      subject: copy.subject(group),
      html: buildEmail({
        logoUrl: `${publicUrl}/logo.png`,
        title: copy.title,
        offer: copy.offer(inviterName, group),
        ctaLabel: copy.cta,
        ctaUrl: inviteUrl,
        footer: copy.footer
      })
    })
    if (mailError) throw new Error(`Sending email failed: ${mailError.message}`)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
