'use strict';

const configured = process.env.FMB_BUILD_TIMESTAMP;
if (configured) {
  const RealDate = global.Date;
  const fixedMilliseconds = RealDate.parse(configured);

  if (!Number.isFinite(fixedMilliseconds)) {
    throw new Error(`Invalid FMB_BUILD_TIMESTAMP: ${configured}`);
  }

  function FixedDate(...args) {
    if (new.target) {
      return args.length === 0 ? new RealDate(fixedMilliseconds) : new RealDate(...args);
    }
    return new RealDate(fixedMilliseconds).toString();
  }

  FixedDate.prototype = RealDate.prototype;
  Object.setPrototypeOf(FixedDate, RealDate);
  FixedDate.now = () => fixedMilliseconds;
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC = RealDate.UTC;

  global.Date = FixedDate;
}
