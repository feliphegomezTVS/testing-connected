import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: "active",
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/peer/send",
      name: "peer-send",
      component: () => import("../views/PeerSendView.vue"),
    },
    {
      path: "/peer/receive",
      name: "peer-receive",
      component: () => import("../views/PeerReceiveView.vue"),
    },
  ],
});

export default router;
