
import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const myCustomTheme: CustomThemeConfig = {
	name: 'my-custom-theme',
	properties: {
		// =~= Theme Properties =~=
		"--theme-font-family-base": `system-ui`,
		"--theme-font-family-heading": `system-ui`,
		"--theme-font-color-base": "0 0 0",
		"--theme-font-color-dark": "255 255 255",
		"--theme-rounded-base": "9999px",
		"--theme-rounded-container": "8px",
		"--theme-border-base": "1px",
		// =~= Theme On-X Colors =~=
		"--on-primary": "0 0 0",
		"--on-secondary": "0 0 0",
		"--on-tertiary": "0 0 0",
		"--on-success": "0 0 0",
		"--on-warning": "0 0 0",
		"--on-error": "0 0 0",
		"--on-surface": "0 0 0",
		// =~= Theme Colors  =~=
		// primary | #60b579
		"--color-primary-50": "231 244 235", // #e7f4eb
		"--color-primary-100": "223 240 228", // #dff0e4
		"--color-primary-200": "215 237 222", // #d7edde
		"--color-primary-300": "191 225 201", // #bfe1c9
		"--color-primary-400": "144 203 161", // #90cba1
		"--color-primary-500": "96 181 121", // #60b579
		"--color-primary-600": "86 163 109", // #56a36d
		"--color-primary-700": "72 136 91", // #48885b
		"--color-primary-800": "58 109 73", // #3a6d49
		"--color-primary-900": "47 89 59", // #2f593b
		// secondary | #cab642
		"--color-secondary-50": "247 244 227", // #f7f4e3
		"--color-secondary-100": "244 240 217", // #f4f0d9
		"--color-secondary-200": "242 237 208", // #f2edd0
		"--color-secondary-300": "234 226 179", // #eae2b3
		"--color-secondary-400": "218 204 123", // #dacc7b
		"--color-secondary-500": "202 182 66", // #cab642
		"--color-secondary-600": "182 164 59", // #b6a43b
		"--color-secondary-700": "152 137 50", // #988932
		"--color-secondary-800": "121 109 40", // #796d28
		"--color-secondary-900": "99 89 32", // #635920
		// tertiary | #5a81a1
		"--color-tertiary-50": "230 236 241", // #e6ecf1
		"--color-tertiary-100": "222 230 236", // #dee6ec
		"--color-tertiary-200": "214 224 232", // #d6e0e8
		"--color-tertiary-300": "189 205 217", // #bdcdd9
		"--color-tertiary-400": "140 167 189", // #8ca7bd
		"--color-tertiary-500": "90 129 161", // #5a81a1
		"--color-tertiary-600": "81 116 145", // #517491
		"--color-tertiary-700": "68 97 121", // #446179
		"--color-tertiary-800": "54 77 97", // #364d61
		"--color-tertiary-900": "44 63 79", // #2c3f4f
		// success | #4caf50
		"--color-success-50": "228 243 229", // #e4f3e5
		"--color-success-100": "219 239 220", // #dbefdc
		"--color-success-200": "210 235 211", // #d2ebd3
		"--color-success-300": "183 223 185", // #b7dfb9
		"--color-success-400": "130 199 133", // #82c785
		"--color-success-500": "76 175 80", // #4caf50
		"--color-success-600": "68 158 72", // #449e48
		"--color-success-700": "57 131 60", // #39833c
		"--color-success-800": "46 105 48", // #2e6930
		"--color-success-900": "37 86 39", // #255627
		// warning | #ff9800
		"--color-warning-50": "255 240 217", // #fff0d9
		"--color-warning-100": "255 234 204", // #ffeacc
		"--color-warning-200": "255 229 191", // #ffe5bf
		"--color-warning-300": "255 214 153", // #ffd699
		"--color-warning-400": "255 183 77", // #ffb74d
		"--color-warning-500": "255 152 0", // #ff9800
		"--color-warning-600": "230 137 0", // #e68900
		"--color-warning-700": "191 114 0", // #bf7200
		"--color-warning-800": "153 91 0", // #995b00
		"--color-warning-900": "125 74 0", // #7d4a00
		// error | #dc3545
		"--color-error-50": "250 225 227", // #fae1e3
		"--color-error-100": "248 215 218", // #f8d7da
		"--color-error-200": "246 205 209", // #f6cdd1
		"--color-error-300": "241 174 181", // #f1aeb5
		"--color-error-400": "231 114 125", // #e7727d
		"--color-error-500": "220 53 69", // #dc3545
		"--color-error-600": "198 48 62", // #c6303e
		"--color-error-700": "165 40 52", // #a52834
		"--color-error-800": "132 32 41", // #842029
		"--color-error-900": "108 26 34", // #6c1a22
		// surface | #f5f5f5
		"--color-surface-50": "254 254 254", // #fefefe
		"--color-surface-100": "253 253 253", // #fdfdfd
		"--color-surface-200": "253 253 253", // #fdfdfd
		"--color-surface-300": "251 251 251", // #fbfbfb
		"--color-surface-400": "248 248 248", // #f8f8f8
		"--color-surface-500": "245 245 245", // #f5f5f5
		"--color-surface-600": "221 221 221", // #dddddd
		"--color-surface-700": "184 184 184", // #b8b8b8
		"--color-surface-800": "147 147 147", // #939393
		"--color-surface-900": "120 120 120", // #787878

	}
}