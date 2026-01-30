<template>
    <div>
        <h1>Dashboard</h1>
        <pre>{{ session }}</pre>
        <p v-if="!session">Pas de session</p>
        <p v-else>Session active</p>
    </div>
</template>

<script setup>
    const { data: session } = await useFetch('/api/session');

    definePageMeta({
        layout: "dashboard"
    })
</script>