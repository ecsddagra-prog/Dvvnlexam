import './globals.css'

export const metadata = {
  title: 'HR Training & Exam System',
  description: 'Government HR Training Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
