"use strict";

/**
 * ფუნქცია აბრუნებს მცოცავ დღესასწაულებს მოცემული წლისთვის.
 * მომხმარებელს შეუძლია თავად დაამატოს ახალი დღესასწაულები აქ.
 * ფორმატი: { "MM-DD": { name, fact, img, img2 } }
 */
function getFloatingHolidays(year) {
  const holidays = {};

  /**
   * დამხმარე ფუნქცია დღესასწაულის დასამატებლად.
   * @param {Date} date - თარიღის ობიექტი
   * @param {string} name - დღესასწაულის სახელი
   * @param {string} fact - აღწერა
   * @param {string} img - Wikipedia სურათის ძიების ტექსტი
   * @param {string} img2 - მეორე Wikipedia სურათი
   */
  const add = (date, name, fact, img = "", img2 = "") => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const key = `${mm}-${dd}`;
    holidays[key] = {
      name: name || "",
      fact: fact || "",
      img: img || name || "",
      img2: img2 || ""
    };
  };

  // ─── მართლმადიდებლური აღდგომის გამოთვლა (Orthodox Easter) ───
  // Gauss-ის ალგორითმი მართლმადიდებლური აღდგომისთვის (იულიუსის კალენდარი)
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;

  const d = (19 * a + 15) % 30;
  const e = (2 * b + 4 * c + 6 * d + 6) % 7;

  // აღდგომა იულიუსის კალენდრით: 22 მარტი + d + e დღე
  // გრიგორიანულში გადაყვანა: +13 დღე (XX-XXI საუკუნეებში)
  // სულ: 22 + 13 = 35 => მარტში 31 დღეა, ამიტომ 35-31 = 4 აპრილი
  const orthodoxEaster = new Date(year, 2, 22 + d + e + 13);
  //                            მარტი = 2 (0-indexed)

  // ─── აღდგომასთან დაკავშირებული დღეები ───
  const goodFriday = new Date(orthodoxEaster);
  goodFriday.setDate(orthodoxEaster.getDate() - 2);

  const greatSaturday = new Date(orthodoxEaster);
  greatSaturday.setDate(orthodoxEaster.getDate() - 1);

  const easterMonday = new Date(orthodoxEaster);
  easterMonday.setDate(orthodoxEaster.getDate() + 1);

  // ─── სხვა მოძრავი დღესასწაულები ───
  const palmSunday = new Date(orthodoxEaster);
  palmSunday.setDate(orthodoxEaster.getDate() - 7);

  const ascension = new Date(orthodoxEaster);
  ascension.setDate(orthodoxEaster.getDate() + 39);

  const pentecost = new Date(orthodoxEaster);
  pentecost.setDate(orthodoxEaster.getDate() + 49);

  // დამატება სიაში
  add(palmSunday, "ბზობა", "დიდებით შესვლა იერუსალიმში უფლისა ჩვენისა იესუ ქრისტესი", "Palm Sunday", "ბზობა");
  add(goodFriday, "წითელი პარასკევი", "დიდი პარასკევი, მაცხოვრის ჯვარცმა", "Good Friday", "წითელი პარასკევი");
  add(greatSaturday, "დიდი შაბათი", "აღდგომის წინა დღე, საფლავში ჩაბანება", "Holy Saturday", "დიდი შაბათი");
  add(orthodoxEaster, "აღდგომა", "ბრწყინვალე აღდგომა უფლისა ჩვენისა იესო ქრისტესი", "აღდგომა", "Пасха");
  // add(easterMonday, "შავი ორშაბათი", "აღდგომიდან მეორე დღე", "Easter Monday", "შავი ორშაბათი");
  add(ascension, "ამაღლება", "ამაღლება უფლისა ჩვენისა იესუ ქრისტესი", "Ascension of Jesus", "ამაღლება");
  add(pentecost, "სულთმოფენობა", "<b>სულიწმიდის მოფენა წმიდა მოციქულებზე.</b> მარტვილია (სულიწმიდის მოფენის დღესასწაულის უძველესი სახელწოდება, რომელიც საღმრთისმსახურო წიგნებში უძველესი დროიდან უცვლელად მოიხსენიებოდა მათ ბეჭდურ გამოცემებამდე (XVIII-XIX სს.)).", "Pentecost", "Духов день");

  // აქ შეიძლება დავამატოთ სხვა მოძრავი დღესასწაულები...

  return holidays;
}
