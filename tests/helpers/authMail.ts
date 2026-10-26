export type CapturedMail = { ID: string; To: { Address: string }[] }
export async function capturedLink(
  mailpit: string,
  email: string,
  kind: 'signup' | 'recovery'
) {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const inbox = (await fetch(mailpit + '/api/v1/messages').then((r) =>
      r.json()
    )) as { messages: CapturedMail[] }
    for (const mail of inbox.messages.filter((mail) =>
      mail.To.some((to) => to.Address.toLowerCase() === email.toLowerCase())
    )) {
      const detail = (await fetch(mailpit + '/api/v1/message/' + mail.ID).then(
        (r) => r.json()
      )) as { HTML: string }
      const hrefs = [...detail.HTML.matchAll(/href="([^"]+)"/g)].map((match) =>
        match[1].replaceAll('&amp;', '&')
      )
      const link = hrefs.find((href) => href.includes('type=' + kind))
      if (link) return { url: link, id: mail.ID }
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Local confirmation/recovery mail was not captured')
}
