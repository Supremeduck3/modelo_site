import { expect, test } from '@playwright/test';

/*
 * Link de seção no cabeçalho escrito como "#precos" é relativo à página
 * atual: em /agendar o clique ia para /agendar#precos e nada acontecia. O menu
 * agora entrega "/#precos", que leva à seção da home de qualquer página.
 */
test('link de seção no menu leva à home de qualquer página', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/agendar');

  await page
    .getByRole('banner')
    .getByRole('link', { name: 'Preços', exact: true })
    .click();

  await expect(page).toHaveURL(/\/#precos$/);
  await expect(page.locator('#precos')).toBeInViewport();
});
