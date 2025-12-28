import { NuxtAuthHandler } from '#auth'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  providers: [
    // @ts-expect-error
    GithubProvider.default({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }),
    // @ts-expect-error
    CredentialsProvider.default({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        // Ajouter votre logique d'authentification ici
        const user = { id: '1', name: 'User', email: 'user@example.com' }

        if (credentials?.username === 'admin' && credentials?.password === 'admin') {
          return user
        }

        return null
      }
    })
  ]
})
