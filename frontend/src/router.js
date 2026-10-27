
import { createRouter, createWebHistory } from 'vue-router'
import Cadastro from './views/Cadastro.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cadastro'
    },
    {
      path: '/cadastro',
      name: 'Cadastro',
      component: Cadastro
    }
  ]
})

export default router
