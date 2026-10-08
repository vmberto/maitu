<script lang="ts">
  import { change } from '../../lib/offline/storage';
  let error = $state('');
  let busy = $state(false);
  async function login(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    error = '';
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: new FormData(event.currentTarget as HTMLFormElement),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in.');
      await change<boolean>('signedOut', () => false);
      // A fresh engine lifecycle is needed after local logout.
      window.location.replace('/');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not sign in.';
    } finally {
      busy = false;
    }
  }
</script>

<main class="mx-auto max-w-sm px-5 py-16">
  <h1 class="mb-8 text-2xl font-semibold text-primary">maitu</h1>
  <form onsubmit={login} class="space-y-4">
    <label class="block"
      >Email<input
        name="email"
        type="email"
        autocomplete="username"
        required
        class="drawer-input mt-1"
      /></label
    ><label class="block"
      >Password<input
        name="password"
        type="password"
        autocomplete="current-password"
        required
        class="drawer-input mt-1"
      /></label
    ><button
      type="submit"
      disabled={busy}
      class="rubber-button rubber-primary w-full"
      >{busy ? 'Signing in…' : 'Login'}</button
    >{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
  </form>
</main>
