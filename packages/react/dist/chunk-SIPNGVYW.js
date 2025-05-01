import {
  LoaderCircle,
  twMerge
} from "./chunk-5NN7OVAV.js";
import {
  __objRest,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/components/spinner.tsx
import { forwardRef } from "react";
import { jsx } from "react/jsx-runtime";
var Spinner = forwardRef(
  (_a, ref) => {
    var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
    return /* @__PURE__ */ jsx(
      LoaderCircle,
      __spreadValues({
        className: twMerge("size-4 animate-spin rounded-full", className),
        ref
      }, props)
    );
  }
);
Spinner.displayName = "Spinner";

export {
  Spinner
};
