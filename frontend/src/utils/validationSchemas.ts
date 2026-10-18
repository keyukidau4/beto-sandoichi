import * as yup from 'yup';

// Login form validation schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: yup
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .required('パスワードは必須です'),
});

// Register form validation schema
export const registerSchema = yup.object({
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: yup
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .required('パスワードは必須です'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('パスワード確認は必須です'),
  name: yup
    .string()
    .min(2, '名前は2文字以上で入力してください')
    .required('名前は必須です'),
  tel: yup
    .string()
    .matches(/^[0-9-]+$/, '有効な電話番号を入力してください')
    .required('電話番号は必須です'),
  zip1: yup
    .string()
    .matches(/^[0-9]{3}$/, '郵便番号（前3桁）を正しく入力してください')
    .required('郵便番号（前3桁）は必須です'),
  zip2: yup
    .string()
    .matches(/^[0-9]{4}$/, '郵便番号（後4桁）を正しく入力してください')
    .required('郵便番号（後4桁）は必須です'),
  address1: yup
    .string()
    .min(5, '住所1は5文字以上で入力してください')
    .required('住所1は必須です'),
  address2: yup
    .string()
    .min(3, '住所2は3文字以上で入力してください')
    .required('住所2は必須です'),
});

// Order form validation schema
export const orderFormSchema = yup.object({
  name: yup
    .string()
    .min(2, '名前は2文字以上で入力してください')
    .required('名前は必須です'),
  tel: yup
    .string()
    .matches(/^[0-9-]+$/, '有効な電話番号を入力してください')
    .required('電話番号は必須です'),
  zip1: yup
    .string()
    .matches(/^[0-9]{3}$/, '郵便番号（前3桁）を正しく入力してください')
    .required('郵便番号（前3桁）は必須です'),
  zip2: yup
    .string()
    .matches(/^[0-9]{4}$/, '郵便番号（後4桁）を正しく入力してください')
    .required('郵便番号（後4桁）は必須です'),
  address1: yup
    .string()
    .min(5, '住所1は5文字以上で入力してください')
    .required('住所1は必須です'),
  address2: yup
    .string()
    .min(3, '住所2は3文字以上で入力してください')
    .required('住所2は必須です'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type OrderFormData = yup.InferType<typeof orderFormSchema>;