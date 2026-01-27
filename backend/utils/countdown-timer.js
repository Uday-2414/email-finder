/**
 * Countdown Timer for Lead Extraction
 * 
 * Estimates processing time based on:
 * - Number of URLs
 * - Presence of social links
 * - Average crawl time per page
 * 
 * Timer counts DOWN from estimated time,
 * dynamically adjusting based on real progress
 */

class CountdownTimer {
  constructor(estimatedSeconds = 30) {
    this.estimatedTotal = estimatedSeconds;
    this.remainingTime = estimatedSeconds;
    this.startTime = Date.now();
    this.isActive = false;
  }

  /**
   * Start countdown timer
   */
  start() {
    this.isActive = true;
    this.startTime = Date.now();
    return this.getRemainingTime();
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime() {
    if (!this.isActive) return this.estimatedTotal;

    const elapsedSeconds = Math.round((Date.now() - this.startTime) / 1000);
    const remaining = Math.max(0, this.estimatedTotal - elapsedSeconds);

    return remaining;
  }

  /**
   * Stop the timer
   */
  stop() {
    this.isActive = false;
    return 0;
  }

  /**
   * Adjust estimated time based on progress
   * If contacts found early, reduce timer
   */
  adjustEstimate(contactsFound, totalUrls) {
    if (contactsFound > 0) {
      // Accelerate timer if contacts found
      const reduction = Math.round(this.estimatedTotal * 0.3); // Reduce by 30%
      this.estimatedTotal = Math.max(5, this.estimatedTotal - reduction);
    }

    if (totalUrls > 1) {
      // Add time for bulk processing
      this.estimatedTotal += totalUrls * 5;
    }

    return this.estimatedTotal;
  }

  /**
   * Estimate time for URL count
   * Base: 5 seconds per URL
   * With Facebook fallback: +10 seconds
   */
  static estimate(urlCount, hasSocialLinks = true) {
    let baseTime = urlCount * 5;
    if (hasSocialLinks) {
      baseTime += 10;
    }
    return Math.min(baseTime, 180); // Cap at 3 minutes
  }

  /**
   * Format time as MM:SS
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Get timer status object for frontend
   */
  getStatus() {
    return {
      remainingSeconds: this.getRemainingTime(),
      formattedTime: CountdownTimer.formatTime(this.getRemainingTime()),
      isActive: this.isActive,
      estimatedTotal: this.estimatedTotal,
      elapsedSeconds: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}

module.exports = CountdownTimer;
