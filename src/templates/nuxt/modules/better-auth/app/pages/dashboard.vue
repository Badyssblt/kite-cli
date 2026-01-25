<template>
    <p>
        {{ session }}
    </p>
</template>


<script setup>
import { authClient } from "~/lib/auth-client";
const { data: session } = await authClient.useSession(useFetch);)
</script>