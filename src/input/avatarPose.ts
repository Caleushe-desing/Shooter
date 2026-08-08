/**
 * Pose samples written by PlayerAvatar after the mixer ticks.
 * PlayerController reads these to place the TPS pivot on the head/eyes.
 */
export const avatarPose = {
  /** Head height above character feet (local Y), smoothed by the avatar. */
  headHeight: 1.55,
  /** 0 = standing locomotion, 1 = full crouch pose. */
  crouchBlend: 0,
  /** True once the Mixamo skeleton has reported at least one head sample. */
  ready: false,
}
