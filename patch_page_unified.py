import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update fetchNews signature and URL
content = content.replace(
    "const fetchNews = async (category: Category | 'state-news', dateStr: string, state: string = '', city: string = '', isBackgroundSync = false) => {",
    "const fetchNews = async (category: Category | 'state-news', dateStr: string, state: string = '', city: string = '', lang: string = 'en', isBackgroundSync = false) => {"
)
content = content.replace(
    "let url = `/api/news?category=${category}&date=${dateStr}`;",
    "let url = `/api/news?category=${category}&date=${dateStr}&lang=${lang}`;"
)

# 2. Update all fetchNews calls
content = content.replace(
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity, !!cached);",
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang, !!cached);"
)
content = content.replace(
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity, true);",
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang, true);"
)
content = content.replace(
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity)",
    "fetchNews(activeCategory, selectedDate, selectedState, selectedCity, selectedLang)"
)

# 3. Add selectedLang to useEffect dependency array
content = content.replace(
    "}, [activeCategory, selectedDate, selectedState, selectedCity, isPastDate, isClient]);",
    "}, [activeCategory, selectedDate, selectedState, selectedCity, selectedLang, isPastDate, isClient]);"
)

# 4. Remove client side filter
content = content.replace(
    "if (selectedLang !== 'all' && article.lang && article.lang !== selectedLang) return false;",
    ""
)

# 5. Fix UI handleLanguageSwitch toggle. We already have handleLanguageChange. The user requested `handleLanguageSwitch` in UI snippet but we called it `handleLanguageChange` earlier. Let's just make sure it's consistent. Wait, the user snippet provided earlier used handleLanguageChange.
# I already updated it to handleLanguageChange in previous request. But let's check if the user asked to change the function name.
# User: `onClick={() => handleLanguageSwitch('en')}`
content = content.replace("handleLanguageChange('en')", "handleLanguageChange('en')")

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("page.tsx unified patched successfully")
