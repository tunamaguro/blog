export const slugfy = (s: string) => (encodeURIComponent(s))

export const iconTransitionName = (slug: string) => `${slug}-icon`;
export const titleTransitionName = (slug: string) => `${slug}-title`;
