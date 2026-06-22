import { SendToSpamParams } from '../../../types/Planning';

const defaultParams: { [key: string]: string } = {
  'par[src][shop]': '1',
  'par[src][auction]': '1',
  'par[src][jour]': '0',
  'par[jour_topic_id][]': '0',
  'par[username]': '',
  'par[address_source][All]': '1',
  'par[address_source][System]': '1',
  'par[source_seller_w]': '',
  'par[article_id]': '',
  'par[sa]': '',
  'par[sa_old]': '0',
  'par[country_shipping]': '',
  'par[country_invoice]': '',
  'par[reseller]': '0',
  'par[no_sent]': '',
  'par[get_newsmail]': '0',
  'par[newsmail]': '3826',
  'par[unread_sign]': '0',
  'par[unread]': '0',
  'par[notsent]': '-1',
  'par[notsent_days]': '30',
  'par[unshipped]': '',
  'par[customer_type_ex]': '-1',
  'par[customer_type][]': '7',
  'par[customer_type_times]': '0',
  'par[items_per_page]': '20000',
  'par[shop_subscribed_do]': '1',
  'par[sms_and_email]': '',
  'par[sms_shop_subscribed_do]': '',
  'par[is_mobile_phone]': '0',
  'par[phone_type]': 'billing',
  'par[ssm_shop_id]': '',
  'par[is_not_opened_newsletter_checked]': '0',
  'par[not_opened_newsletter_days]': '',
  'par[is_not_visited_shop_checked]': '0',
  'par[not_visited_shop_days]': '',
  'par[resend_type]': 'html',
};

export class SpamFormBuilder {
  private formData: URLSearchParams;
  private params: SendToSpamParams;

  constructor(params: SendToSpamParams) {
    this.params = params;
    this.formData = new URLSearchParams();
  }

  private addBaseParams(): this {
    const { shopId, usernameReg } = this.params;

    Object.entries(defaultParams).forEach(([key, value]) => {
      this.formData.append(key, value);
    });

    this.formData.append('par[username_reg]', usernameReg);
    this.formData.append('par[shop_subscribed]', shopId.toString());
    this.formData.append('par[sms_shop_subscribed]', shopId.toString());
    this.formData.append('par[ss_shop_id]', shopId.toString());
    this.formData.append('par[shop_id]', shopId.toString());

    return this;
  }

  private addLangParams(): this {
    const { newsletterSlug } = this.params;

    switch (newsletterSlug) {
      case 'BENL':
      case 'CHDE':
        this.formData.append('par[lang]', 'french');
        this.formData.append('par[lang_does]', '-1');
        break;
      case 'BEFR':
      case 'CHFR':
        this.formData.append('par[lang]', 'french');
        this.formData.append('par[lang_does]', '1');
        break;
      default:
        this.formData.append('par[lang]', '');
        this.formData.append('par[lang_does]', '0');
        break;
    }

    return this;
  }

  private addAbTestConfig(): this {
    const { newsletterIds, isABTest } = this.params;

    this.formData.append('par[resend]', newsletterIds[0].toString());

    if (isABTest && newsletterIds[1]) {
      this.formData.append('par[resend2]', newsletterIds[1].toString());
      this.formData.append('par[resend_ab_test]', '1');
    } else {
      this.formData.append('par[resend2]', '');
      this.formData.append('par[resend_ab_test]', '0');
    }

    this.formData.append('show_table', 'false');

    return this;
  }

  build(): URLSearchParams {
    return this.addBaseParams().addLangParams().addAbTestConfig().formData;
  }
}
