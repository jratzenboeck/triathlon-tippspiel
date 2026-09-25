<template>
  <div class="max-w-md mx-auto mt-8">
    <h1 class="text-2xl font-bold mb-6">{{ $t('profile.title') }}</h1>
    <div class="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <form class="flex flex-col items-center border-b pb-6" @submit.prevent="handleUpload">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="$t('profile.pictureAlt', { name: auth.profile?.display_name })"
          class="h-28 w-28 rounded-full object-cover"
        />
        <div
          v-else
          class="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-100 text-3xl font-semibold text-indigo-700"
          aria-hidden="true"
        >
          {{ profileInitial }}
        </div>

        <div class="mt-4 w-full">
          <label for="profile-picture" class="block text-sm font-medium text-gray-700">{{
            $t('profile.picture')
          }}</label>
          <input
            id="profile-picture"
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="uploading || removing"
            class="input file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
            @change="handleFileChange"
          />
          <p class="mt-1 text-xs text-gray-500">{{ $t('profile.pictureHint') }}</p>
          <p role="alert" class="mt-2 min-h-5 text-sm text-red-600">{{ error }}</p>
          <p role="status" class="mt-2 min-h-5 text-sm text-green-600">{{ success }}</p>
          <button
            type="submit"
            :disabled="!selectedFile || uploading || removing"
            class="btn btn-primary mt-3 w-full"
          >
            {{ uploading ? $t('profile.pictureUploading') : $t('profile.pictureUpload') }}
          </button>
          <button
            v-if="auth.profile?.avatar_path"
            type="button"
            :disabled="removing || uploading"
            class="btn btn-tab-inactive mt-2 w-full"
            @click="handleRemove"
          >
            {{ removing ? $t('profile.pictureRemoving') : $t('profile.pictureRemove') }}
          </button>
        </div>
      </form>

      <div>
        <label class="block text-sm font-medium text-gray-700">{{
          $t('profile.displayName')
        }}</label>
        <p class="mt-1 text-gray-900">{{ auth.profile?.display_name }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('profile.email') }}</label>
        <p class="mt-1 text-gray-900">{{ auth.user?.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const BUCKET_NAME = 'profile-pictures'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

const { t } = useI18n()
const auth = useAuthStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const removing = ref(false)
const error = ref('')
const success = ref('')

const avatarUrl = computed(() => {
  if (!auth.profile?.avatar_path) return null
  return supabase.storage.from(BUCKET_NAME).getPublicUrl(auth.profile.avatar_path).data.publicUrl
})

const profileInitial = computed(() => auth.profile?.display_name?.charAt(0).toUpperCase() || '?')

function handleFileChange(event) {
  error.value = ''
  success.value = ''
  selectedFile.value = event.target.files?.[0] || null

  if (!selectedFile.value) return
  if (!IMAGE_EXTENSIONS[selectedFile.value.type]) {
    error.value = t('profile.pictureInvalidType')
    selectedFile.value = null
    event.target.value = ''
    return
  }
  if (selectedFile.value.size > MAX_FILE_SIZE) {
    error.value = t('profile.pictureTooLarge')
    selectedFile.value = null
    event.target.value = ''
  }
}

async function handleUpload() {
  if (!selectedFile.value || !auth.user) return

  uploading.value = true
  error.value = ''
  success.value = ''

  try {
    const previousAvatarPath = auth.profile?.avatar_path
    const extension = IMAGE_EXTENSIONS[selectedFile.value.type]
    const avatarPath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(avatarPath, selectedFile.value, {
        cacheControl: '3600',
        contentType: selectedFile.value.type
      })

    if (uploadError) throw uploadError

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_path: avatarPath })
      .eq('id', auth.user.id)
      .select()
      .single()

    if (updateError) {
      await supabase.storage.from(BUCKET_NAME).remove([avatarPath])
      throw updateError
    }

    auth.profile = updatedProfile
    if (previousAvatarPath) {
      await supabase.storage.from(BUCKET_NAME).remove([previousAvatarPath])
    }

    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    success.value = t('profile.pictureUploaded')
  } catch {
    error.value = t('profile.pictureUploadFailed')
  } finally {
    uploading.value = false
  }
}

async function handleRemove() {
  if (removing.value || !auth.user || !auth.profile?.avatar_path) return

  removing.value = true
  error.value = ''
  success.value = ''

  const avatarPath = auth.profile.avatar_path

  try {
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_path: null })
      .eq('id', auth.user.id)
      .select()
      .single()

    if (updateError) throw updateError

    auth.profile = updatedProfile
    await supabase.storage.from(BUCKET_NAME).remove([avatarPath])
    success.value = t('profile.pictureRemoved')
  } catch {
    error.value = t('profile.pictureRemoveFailed')
  } finally {
    removing.value = false
  }
}
</script>
