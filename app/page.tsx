import { redirect } from "next/navigation"

export default function Home() {
  // A home root não foi definida no PRD, então por ser um SaaS 
  // vamos redirecionar as visitas deslogadas direto pro /login 
  redirect('/login')
}
