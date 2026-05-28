import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CustomerRegisterView from './CustomerRegisterView.vue'
import api from '../../api/index.js'

vi.mock('../../api/index.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

// Component reads the storeId from the route params.
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { storeId: '7' } }),
}))

async function mountView() {
  const wrapper = mount(CustomerRegisterView)
  await flushPromises() // resolve the onMounted store fetch
  return wrapper
}

async function fillForm(wrapper, { withConsent = true } = {}) {
  await wrapper.get('input[autocomplete="name"]').setValue('João da Silva')
  await wrapper.get('input[inputmode="numeric"]').setValue('52998224725')
  await wrapper.get('input[inputmode="tel"]').setValue('11988887777')
  await wrapper.get('input[type="date"]').setValue('1995-03-10')
  if (withConsent) await wrapper.get('input[type="checkbox"]').setValue(true)
}

describe('CustomerRegisterView', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: { store_name: 'Loja Teste' } })
  })

  it('fetches and shows the store name', async () => {
    const wrapper = await mountView()
    expect(api.get).toHaveBeenCalledWith('api/v1/public/store/7')
    expect(wrapper.text()).toContain('Loja Teste')
  })

  it('shows a not-found message when the store fetch fails', async () => {
    api.get.mockRejectedValueOnce(new Error('404'))
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Loja não encontrada')
  })

  it('submits digits-only payload with consent and shows the success message', async () => {
    api.post.mockResolvedValueOnce({
      data: { message: 'Cadastro realizado com sucesso!' },
    })
    const wrapper = await mountView()

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('api/v1/public/customers', {
      store_id: '7',
      name: 'João da Silva',
      cpf: '52998224725',
      phone_number: '11988887777',
      birth_date: '1995-03-10',
      consent: true,
    })
    expect(wrapper.text()).toContain('Cadastro realizado!')
    expect(wrapper.text()).toContain('Cadastro realizado com sucesso!')
  })

  it('keeps the submit button disabled until consent is given (LGPD Art. 7, I)', async () => {
    const wrapper = await mountView()
    await fillForm(wrapper, { withConsent: false })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('shows the generic error returned by the API', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Não foi possível concluir o cadastro. Verifique os dados informados e tente novamente.' } },
    })
    const wrapper = await mountView()

    await fillForm(wrapper)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível concluir o cadastro')
  })
})
