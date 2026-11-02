import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'inicio', component: () => import('../views/Inicio.vue') },
    { path: '/explorar', name: 'explorar', component: () => import('../views/Explorar.vue') },
    { path: '/cadastro', name: 'cadastro', component: () => import('../views/Cadastro.vue') },
    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    { path: '/perfil', name: 'perfil', component: () => import('../views/Perfil.vue') }
  ]
})

export default router