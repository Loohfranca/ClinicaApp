<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<script setup>
// App.vue - Componente raiz da aplicação
// O Vue Router cuida da renderização das views
</script>

<style>
/* Estilos globais já definidos em style.css */
</style>
