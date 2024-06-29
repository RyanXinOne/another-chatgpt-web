<script setup lang='ts'>
import pkg from '../../../../package.json'
</script>

<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-bold">
      Version - {{ pkg.version }}
    </h2>
    <div class="p-2 space-y-2 rounded-md bg-neutral-100 dark:bg-neutral-700">
      <p>
        {{ $t("setting.openSource") }}
        <a
          class="text-blue-600 dark:text-blue-500"
          href="https://github.com/RyanXinOne/another-chatgpt-web"
          target="_blank"
        >
          GitHub
        </a>
        {{ $t("setting.freeMIT") }}
      </p>
    </div>
  </div>
</template>
