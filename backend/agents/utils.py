def cn(*inputs):
    """
    Combines conditional class-like strings into a single space-separated string.

    - Ignores None, False, empty strings
    - Flattens nested lists/tuples
    - Similar intent to clsx + twMerge (logic-level, not Tailwind-specific)

    Args:
        *inputs: Any values (str, list, tuple, bool, None)

    Returns:
        str
    """

    result = []

    for item in inputs:
        if not item:
            continue

        if isinstance(item, (list, tuple)):
            for sub in item:
                if sub:
                    result.append(str(sub))
        else:
            result.append(str(item))

    return " ".join(result)