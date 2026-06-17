import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Login from '../src/views/login.vue';
import api from '../src/services/api';

// Mock api
vi.mock('../src/services/api', () => ({
  default: {
    post: vi.fn(),
  }
}));

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form properly', () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          RouterLink: true
        }
      }
    });

    // Check header
    expect(wrapper.find('h2').text()).toBe('Masuk ke Akun Anda');
    
    // Check input fields
    expect(wrapper.find('input#email').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    
    // Check submit button
    expect(wrapper.find('button.submit-btn').exists()).toBe(true);
  });

  // --- Positive Case ---
  it('saves token to localStorage on successful login (Positive Case)', async () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          RouterLink: true
        }
      }
    });

    // Mock successful API response
    const mockToken = 'mocked_jwt_token_123';
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          token: mockToken
        }
      }
    });

    // Mock localStorage spy
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Fill the form
    await wrapper.find('input#email').setValue('user@example.com');
    await wrapper.find('input#password').setValue('password123');

    // Submit
    await wrapper.find('form').trigger('submit.prevent');

    // Flush promises to wait for async login method
    await flushPromises();

    // Verify axios call to the correct Railway URL
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@example.com',
      password: 'password123'
    });

    // Verify localStorage storage
    expect(setItemSpy).toHaveBeenCalledWith('token', mockToken);
    expect(localStorage.getItem('token')).toBe(mockToken);

    // Verify success alert renders
    expect(wrapper.find('.alert-success').exists()).toBe(true);
    expect(wrapper.find('.alert-success').text()).toContain('Login berhasil');
  });

  // --- Negative Case (Validation) ---
  it('shows validation error when email is empty (Negative Case - Validation)', async () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          RouterLink: true
        }
      }
    });

    // Set email empty and fill password
    await wrapper.find('input#email').setValue('');
    await wrapper.find('input#password').setValue('password123');

    // Trigger form submit
    await wrapper.find('form').trigger('submit.prevent');

    // Check validation error
    const emailError = wrapper.find('.form-group:nth-of-type(1) .error-text');
    expect(emailError.exists()).toBe(true);
    expect(emailError.text()).toBe('Email wajib diisi');
  });

  it('shows validation error when password is empty (Negative Case - Validation)', async () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          RouterLink: true
        }
      }
    });

    // Set valid email and empty password
    await wrapper.find('input#email').setValue('user@example.com');
    await wrapper.find('input#password').setValue('');

    // Trigger form submit
    await wrapper.find('form').trigger('submit.prevent');

    // Check validation error
    const passwordError = wrapper.find('.form-group:nth-of-type(2) .error-text');
    expect(passwordError.exists()).toBe(true);
    expect(passwordError.text()).toBe('Password wajib diisi');
  });

  // --- Negative Case (API Error) ---
  it('shows server error message when API returns 401 (Negative Case - API Error)', async () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          RouterLink: true
        }
      }
    });

    // Mock API error response (e.g. 401 Unauthorized)
    const backendErrorMessage = 'Kredensial tidak valid';
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          message: backendErrorMessage
        }
      }
    });

    // Fill the form
    await wrapper.find('input#email').setValue('wrong@example.com');
    await wrapper.find('input#password').setValue('wrongpassword');

    // Submit
    await wrapper.find('form').trigger('submit.prevent');

    // Flush promises
    await flushPromises();

    // Verify error alert is shown with backend message
    expect(wrapper.find('.alert-error').exists()).toBe(true);
    expect(wrapper.find('.alert-error').text()).toContain(backendErrorMessage);
  });
});
