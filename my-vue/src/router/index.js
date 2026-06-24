import { createRouter, createWebHistory } from 'vue-router'
import Overview from '../views/Overview.vue'
import NationalTrend from '../views/NationalTrend.vue'
import ProvincialCompare from '../views/ProvincialCompare.vue'
import StructureAnalysis from '../views/StructureAnalysis.vue'

const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'Overview', component: Overview },
  { path: '/national-trend', name: 'NationalTrend', component: NationalTrend },
  { path: '/provincial-compare', name: 'ProvincialCompare', component: ProvincialCompare },
  { path: '/structure-analysis', name: 'StructureAnalysis', component: StructureAnalysis },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
